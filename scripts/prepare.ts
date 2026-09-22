// expected stdin is the tag name
const tag = (await new Response(Deno.stdin.readable).text()).trim();

const version = tag.replace(/^v/, "");

for (const path of ["work", "artifacts"] as const) {
    try {
        await Deno.remove(path, { recursive: true });
    } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
            throw error;
        }
    }
}

for (const path of ["work/downloads", "work/input", "work/output", "artifacts"] as const) {
    await Deno.mkdir(path, { recursive: true });
}

const githubOutput = Deno.env.get("GITHUB_OUTPUT");
if (!githubOutput) {
    throw new Error("Cannot run outside of GitHub CI.");
}

// these can be read by later steps
await Deno.writeTextFile(githubOutput, `tag=${tag}\nversion=${version}\n`);

console.log(`Iosevka tag: ${tag}`);
