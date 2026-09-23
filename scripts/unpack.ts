import { Uint8ArrayReader, Uint8ArrayWriter, ZipReader } from "@zip-js/zip-js";
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

    const reader = new ZipReader(new Uint8ArrayReader(await Deno.readFile(archive)));
    try {
        for (const entry of await reader.getEntries()) {
            const { ext, base, name } = parse(entry.filename);

            if (entry.directory || ext.toLowerCase() !== ".ttf") {
                continue;
            }

            await Deno.writeFile(join(destination, base), await entry.getData(new Uint8ArrayWriter()), { createNew: true });

            const variant = name.match(new RegExp(`^${sourceFamily}-(.+)$`))?.[1];
            if (!variant) {
                throw new Error(`Unexpected TTF filename: ${base}`);
            }

            patchPlan.push(`${directory}\t${fontName}-${variant}\t${base}`);

            count++;
        }
    } finally {
        await reader.close();
    }

    if (!count) {
        throw new Error(`${archive} did not contain TTF files`);
    }

    console.log(`Extracted ${count} ${sourceFamily} fonts.`);
}

await Deno.writeTextFile("work/patch-plan.tsv", `${patchPlan.join("\n")}\n`);
