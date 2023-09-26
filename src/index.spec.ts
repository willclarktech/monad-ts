import greeting from "./";

describe("test suite", () => {
	it("tests", () => {
		expect(greeting).toStrictEqual("Hello world");
	});
});
