import type { IMonad } from "./monad";
import type { IMonoid, Monoid } from "./monoid";
import type { Writable } from "./util";

export type Writer<A, T, W extends Monoid<T>> = {
	readonly value: A;
	readonly logs: W;
};

export interface IWriter<A, B, T, W extends Monoid<T>>
	extends IMonad<
		A,
		Writer<A, T, W>,
		Writer<Writer<A, T, W>, T, W>,
		B,
		Writer<B, T, W>,
		Writer<(a: A) => B, T, W>
	> {
	// Functor
	readonly fmap: <C>(fab: (a: A) => C, w: Writer<A, T, W>) => Writer<C, T, W>;
	// Applicative
	readonly pure: <C>(a: C) => Writer<C, T, W>;
	readonly apply: (
		fab: Writer<(a: A) => B, T, W>,
		w: Writer<A, T, W>,
	) => Writer<B, T, W>;
	// Monad
	readonly join: <C>(wwa: Writer<Writer<C, T, W>, T, W>) => Writer<C, T, W>;
	readonly bind: (
		w: Writer<A, T, W>,
		fab: (a: A) => Writer<B, T, W>,
	) => Writer<B, T, W>;
}

type WriterFactory = {
	new <A, B, T, W extends Monoid<T>>(monoid: IMonoid<A, W>): IWriter<
		A,
		B,
		T,
		W
	>;
};

export const Writer: WriterFactory = function <A, B, T, W extends Monoid<T>>(
	this: Writable<IWriter<A, B, T, W>>,
	monoid: IMonoid<A, W>,
): void {
	// Functor
	this.fmap = <C>(fab: (a: A) => C, w: Writer<A, T, W>): Writer<C, T, W> => ({
		value: fab(w.value),
		logs: w.logs,
	});

	// Applicative
	this.pure = <C>(c: C): Writer<C, T, W> => ({
		value: c,
		logs: monoid.empty(),
	});
	this.apply = (
		fab: Writer<(a: A) => B, T, W>,
		w: Writer<A, T, W>,
	): Writer<B, T, W> => ({
		value: fab.value(w.value),
		logs: monoid.concat(w.logs, fab.logs),
	});

	// Monad
	this.join = <C>(wwa: Writer<Writer<C, T, W>, T, W>): Writer<C, T, W> => ({
		value: wwa.value.value,
		logs: monoid.concat(wwa.logs, wwa.value.logs),
	});
	this.bind = (
		w: Writer<A, T, W>,
		fab: (a: A) => Writer<B, T, W>,
	): Writer<B, T, W> => this.join(this.fmap(fab, w));

	// NOTE: TS apparently has trouble typing constructible functions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as WriterFactory;
