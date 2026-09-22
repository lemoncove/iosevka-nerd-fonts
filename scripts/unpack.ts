import * as zip from "@quentinadam/zip";
import { join, parse } from "@std/path";

const version = Deno.args[0];
if (!version) { throw new Error("Expected the Iosevka version as an argument"); }

const patchPlan: string[] = [];

for (
    const [sourceFamily, directory, fontName] of [
        ["Iosevka", "iosevka", "Iosevka Nerd Font"],
        ["IosevkaSlab", "iosevka_slab", "Iosevka Nerd Font Slab"],
    ] as const
) {
    const destination = join("work/input", directory);
    await Deno.mkdir(destination, { recursive: true });
    await Deno.mkdir(join("work/output", directory), { recursive: true });

    const archive = join("work/downloads", `PkgTTF-${sourceFamily}-${version}.zip`);

    let count = 0;

    for (const entry of await zip.extract(await Deno.readFile(archive))) {
        const { ext, base, name } = parse(entry.name);

        if (ext.toLowerCase() !== ".ttf") {
            continue;
        }

        await Deno.writeFile(join(destination, base), entry.data, { createNew: true });

        const style = name.match(new RegExp(`^${sourceFamily}-(.+)$`))?.[1];
        if (!style) {
            throw new Error(`Unexpected TTF filename: ${base}`);
        }

        patchPlan.push(`${directory}\t${fontName}-${style}\t${base}`);

        count++;
    }

    if (!count) {
        throw new Error(`${archive} did not contain TTF files`);
    }

    console.log(`Extracted ${count} ${sourceFamily} fonts.`);
}

await Deno.writeTextFile("work/patch-plan.tsv", `${patchPlan.join("\n")}\n`);
