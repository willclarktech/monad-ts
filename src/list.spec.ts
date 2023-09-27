/* eslint-disable @typescript-eslint/no-unused-vars */
import { List } from "./list";

describe("List", () => {
	it("pure creates a List from a value", () => {
		// @ts-expect-error Checking pure types input correctly
		const listStringBad: List<string> = List.pure(21);
		const listString: List<string> = List.pure("21");
		expect(listString).toBeTruthy();

		// @ts-expect-error Checking pure types input correctly
		const listNumberBad: List<number> = List.pure("123");
		const listNumber: List<number> = List.pure(123);
		expect(listNumber).toBeTruthy();
	});

	it("bind chains List instances", () => {
		const stringToNumber = (s: string): List<number> => List.pure(parseInt(s));
		const numberToString = (n: number): List<string> => List.pure(n.toString());
		const list = List.cons(1, List.cons(2, List.pure(3)));
		const listResult = list
			.bind(numberToString)
			.bind(stringToNumber)
			.bind((n) => List.cons(5, List.pure(n ** 2)));
		expect(listResult.toArray()).toEqual([5, 1, 5, 4, 5, 9]);
	});
});
