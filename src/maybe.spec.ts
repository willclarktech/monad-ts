import { Maybe } from "./maybe";

describe("Maybe", () => {
	describe("isNothing and isJust", () => {
		it("should correctly identify Nothing", () => {
			const maybe = Maybe.nothing<number>();
			expect(maybe.isNothing()).toBe(true);
			expect(maybe.isJust()).toBe(false);
		});

		it("should correctly identify Just", () => {
			const maybe = Maybe.just(42);
			expect(maybe.isNothing()).toBe(false);
			expect(maybe.isJust()).toBe(true);
		});
	});

	describe("fmap", () => {
		it("should map over Just", () => {
			const maybe = Maybe.just(21).fmap((x) => x * 2);
			expect(maybe.isJust()).toBe(true);
			expect(maybe.fromJust()).toBe(42);
		});

		it("should not map over Nothing", () => {
			const maybe = Maybe.nothing<number>().fmap((x) => x * 2);
			expect(maybe.isNothing()).toBe(true);
		});
	});

	describe("pure", () => {
		it("should create a Just from a value", () => {
			const maybe = Maybe.pure(42);
			expect(maybe.isJust()).toBe(true);
			expect(maybe.fromJust()).toBe(42);
		});
	});

	describe("apply", () => {
		it("should apply function wrapped in Just", () => {
			const maybeFn = Maybe.just((x: number) => x * 2);
			const maybe = Maybe.just(21).apply(maybeFn);
			expect(maybe.isJust()).toBe(true);
			expect(maybe.fromJust()).toBe(42);
		});

		it("should not apply function if either is Nothing", () => {
			const maybeFn = Maybe.nothing<(x: number) => number>();
			const maybe = Maybe.just(21).apply(maybeFn);
			expect(maybe.isNothing()).toBe(true);
		});
	});

	describe("join", () => {
		it("should join nested Just", () => {
			const maybe = Maybe.join(Maybe.just(Maybe.just(42)));
			expect(maybe.isJust()).toBe(true);
			expect(maybe.fromJust()).toBe(42);
		});

		it("should join to Nothing if outer is Nothing", () => {
			const maybe = Maybe.join(Maybe.nothing<Maybe<number>>());
			expect(maybe.isNothing()).toBe(true);
		});
	});

	describe("bind", () => {
		it("should bind function over Just", () => {
			const maybe = Maybe.just(21).bind((x) => Maybe.just(x * 2));
			expect(maybe.isJust()).toBe(true);
			expect(maybe.fromJust()).toBe(42);
		});

		it("should bind to Nothing if initial is Nothing", () => {
			const maybe = Maybe.nothing<number>().bind((x) => Maybe.just(x * 2));
			expect(maybe.isNothing()).toBe(true);
		});
	});
});
