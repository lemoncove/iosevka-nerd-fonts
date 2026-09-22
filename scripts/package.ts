import * as zip from "@quentinadam/zip";
import { basename, extname, join } from "@std/path";

const version = Deno.args[0];
if (!version) { throw new Error("Expected the Iosevka version as an argument"); }

for (
    const [directory, name] of [
        ["iosevka", "IosevkaNerdFont"],
        ["iosevka_slab", "IosevkaNerdFontSlab"],
    ] as const
) {
    const patched = (await Array.fromAsync(Deno.readDir(join("work/output", directory))))
        .filter((entry) => entry.isFile && extname(entry.name.toLowerCase()) === ".ttf")
        .map((entry) => join("work/output", directory, entry.name))
        .sort();

    const entries = await Promise.all(patched.map(async (path) => ({
        name: basename(path),
        data: await Deno.readFile(path),
    })));

    await Deno.mkdir("artifacts", { recursive: true });
    const archive = join("artifacts", `${name}-${version}.zip`);

    await Deno.writeFile(archive, await zip.create(entries));
    console.log(`Created ${archive} with ${patched.length} fonts`);
}
