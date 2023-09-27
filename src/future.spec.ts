import { Future } from "./future";

describe("Future", () => {
	it("has a placeholder test", () => {
		const future = Future.resolve(123);
		expect(future).toBeTruthy();
	});
});
