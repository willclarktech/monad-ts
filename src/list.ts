import type { Monad } from "./monad";

export class List<A> implements Monad<A> {
	private constructor(private readonly data: readonly A[]) {}

	public static nil<B>(): List<B> {
		return new List([]);
	}

	public static cons<B>(value: B, list: List<B>): List<B> {
		return new List([value, ...list.data]);
	}

	public get length(): number {
		return this.data.length;
	}

	public toArray(): readonly A[] {
		return this.data;
	}

	public head(): A {
		if (this.length === 0) {
			throw new Error("Cannot get head of empty List");
		}
		return this.data[0];
	}

	public tail(): List<A> {
		if (this.length === 0) {
			throw new Error("Cannot get head of empty List");
		}
		return new List(this.data.slice(1));
	}

	public map<B>(f: (a: A) => B): List<B> {
		return new List(this.data.map(f));
	}

	public fmap = this.map.bind(this);

	public static pure<B>(value: B): List<B> {
		return List.cons(value, List.nil());
	}

	public apply<B>(fab: List<(a: A) => B>): List<B> {
		return new List(
			fab.data.reduce(
				(acc: readonly B[], f) => acc.concat(this.data.map(f)),
				[],
			),
		);
	}

	public static join<B>(lists: List<List<B>>): List<B> {
		return new List(
			lists.data.reduce(
				(acc: readonly B[], innerList) => acc.concat(innerList.data),
				[],
			),
		);
	}

	public bind<B>(f: (a: A) => List<B>): List<B> {
		return List.join(this.fmap(f));
	}
}
