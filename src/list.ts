import type { IMonad } from "./monad";
import type { IMonoid } from "./monoid";
import type { Writable } from "./util";

export type List<A> = readonly A[];

export interface IList<A, B>
	extends IMonad<A, List<A>, List<List<A>>, B, List<B>, List<(a: A) => B>>,
		IMonoid<A, List<A>> {
	readonly nil: <C>() => List<C>;
	readonly cons: <C>(a: C, l: List<C>) => List<C>;
	readonly head: <C>(l: List<C>) => C;
	readonly tail: <C>(l: List<C>) => List<C>;
	readonly map: <C>(fab: (a: A) => C, l: List<A>) => List<C>;
	// Semigroup
	readonly concat: <C>(l1: List<C>, l2: List<C>) => List<C>;
	// Monoid
	readonly empty: <C>() => List<C>;
	// Functor
	readonly fmap: <C>(fab: (a: A) => C, l: List<A>) => List<C>;
	// Applicative
	readonly pure: <C>(a: C) => List<C>;
	readonly apply: (fab: List<(a: A) => B>, l: List<A>) => List<B>;
	// Monad
	readonly join: <C>(lla: List<List<C>>) => List<C>;
	readonly bind: (l: List<A>, fab: (a: A) => List<B>) => List<B>;
}

type ListFactory = { new <A, B>(): IList<A, B> };

export const List: ListFactory = function <A, B>(
	this: Writable<IList<A, B>>,
): void {
	this.nil = <C>(): List<C> => [];
	this.cons = <C>(a: C, l: List<C>): List<C> => [a, ...l];
	this.head = <C>(l: List<C>): C => {
		if (l.length === 0) {
			throw new Error("Cannot get head of empty List");
		}
		return l[0];
	};
	this.tail = <C>(l: List<C>): List<C> => {
		if (l.length === 0) {
			throw new Error("Cannot get tail of empty List");
		}
		return l.slice(1);
	};
	this.map = <C>(fab: (a: A) => C, l: List<A>): List<C> => l.map(fab);

	// Semigroup
	this.concat = <C>(l1: List<C>, l2: List<C>): List<C> => [...l1, ...l2];

	// Monoid
	this.empty = this.nil;

	// Functor
	this.fmap = this.map;

	// Applicative
	this.pure = <C>(a: C): List<C> => [a];
	this.apply = (fab: List<(a: A) => B>, l: List<A>): List<B> =>
		l.flatMap((a) => fab.map((f) => f(a)));

	// Monad
	this.join = <C>(lla: List<List<C>>): List<C> => lla.flat();
	this.bind = (l: List<A>, fab: (a: A) => List<B>): List<B> =>
		this.join(this.fmap(fab, l));

	// NOTE: TS apparently has trouble typing constructible functions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as ListFactory;
