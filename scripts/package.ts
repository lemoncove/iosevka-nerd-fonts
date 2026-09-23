import { Uint8ArrayReader, ZipWriter } from "@zip-js/zip-js";
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

    await Deno.mkdir("artifacts", { recursive: true });
    const archive = join("artifacts", `${name}-${version}.zip`);

    const writer = new ZipWriter((await Deno.open(archive, { write: true, create: true, truncate: true })).writable);
    for (const path of patched) {
        await writer.add(basename(path), new Uint8ArrayReader(await Deno.readFile(path)));
    }
    await writer.close();

    console.log(`Created ${archive} with ${patched.length} fonts`);
}
