import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { EMPTY_CONFIG, loadConfig, saveConfig } from "./userConfig";

vi.mock("./api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
// The real private file would be seeded into these tests on a machine that has it
vi.mock("../data/private/personal.json", () => ({ default: undefined }));

const serve = (matrixJson: string) => vi.mocked(api.get).mockResolvedValue({ matrixJson });
const withCell = (text: string) => ({ ...EMPTY_CONFIG, cells: EMPTY_CONFIG.cells.map((c, i) => (i === 0 ? text : c)) });

beforeEach(() => vi.clearAllMocks());

describe("saveConfig", () => {
  it("refuses to save the placeholder grid shown when the API was unreachable", async () => {
    await expect(saveConfig(withCell("edited"))).rejects.toThrow(/hasn't loaded/);
    expect(api.post).not.toHaveBeenCalled();
  });

  it("saves a config that was loaded, including a brand-new empty one", async () => {
    serve("[]");
    const config = await loadConfig();
    await saveConfig({ ...config, cells: config.cells.map((c, i) => (i === 0 ? "edited" : c)) });

    const body = vi.mocked(api.post).mock.calls[0][1] as { matrixJson: string };
    expect(JSON.parse(body.matrixJson)).toMatchObject({ version: 3, tracks: {}, timetable: {} });
    expect(JSON.parse(body.matrixJson).cells[0]).toBe("edited");
  });
});

describe("loadConfig", () => {
  it.each(["{ broken", '{"version":4,"cells":[]}'])("throws instead of treating %s as empty", async (json) => {
    serve(json);
    await expect(loadConfig()).rejects.toThrow();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("keeps stored content and fills blank cells with placeholders", async () => {
    serve(JSON.stringify({ version: 3, cells: ["mine", ""], tracks: { clean: "x" }, examLabel: "E" }));
    const config = await loadConfig();
    expect(config.cells).toHaveLength(81);
    expect(config.cells[0]).toBe("mine");
    expect(config).toMatchObject({ tracks: { clean: "x" }, examLabel: "E", timetable: {} });
  });
});
