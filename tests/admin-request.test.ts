import { expect, it } from "vitest";
import { limitedJSON } from "../admin/lib/request";
it("leitura de JSON limita bytes efetivamente recebidos e recusa MIME e JSON inválidos", async () => {
  const request = (body: string, type = "application/json") =>
    new Request("https://editor.example.org/api/workspace", {
      method: "POST",
      headers: { "Content-Type": type },
      body,
    });
  await expect(limitedJSON(request('{"title":"Guia"}'))).resolves.toEqual({
    title: "Guia",
  });
  await expect(limitedJSON(request("not json"))).rejects.toThrow(
    "JSON inválido",
  );
  await expect(limitedJSON(request("{}", "text/plain"))).rejects.toThrow(
    "Envie JSON",
  );
  await expect(
    limitedJSON(request(JSON.stringify({ body: "x".repeat(513 * 1024) }))),
  ).rejects.toThrow("512 KB");
});
