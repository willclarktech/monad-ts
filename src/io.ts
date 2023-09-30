import type { IMonad } from "./monad";
import type { Writable } from "./util";

export type IO<A> = () => A;

export interface IIO<A, B>
	extends IMonad<A, IO<A>, IO<IO<A>>, B, IO<B>, IO<(a: A) => B>> {
	readonly perform: (io: IO<A>) => A;
	// Functor
	readonly fmap: <C>(fab: (a: A) => C, io: IO<A>) => IO<C>;
	// Applicative
	readonly pure: <C>(a: C) => IO<C>;
	readonly apply: (fab: IO<(a: A) => B>, io: IO<A>) => IO<B>;
	// Monad
	readonly join: <C>(ioio: IO<IO<C>>) => IO<C>;
	readonly bind: (io: IO<A>, fab: (a: A) => IO<B>) => IO<B>;
}

type IOFactory = { new <A, B>(): IIO<A, B> };

export const IO: IOFactory = function <A, B>(this: Writable<IIO<A, B>>): void {
	// Perform the IO action
	this.perform = (io: IO<A>): A => io();

	// Functor
	this.fmap = <C>(fab: (a: A) => C, io: IO<A>): IO<C> => {
		return () => fab(io());
	};

	// Applicative
	this.pure = <C>(a: C): IO<C> => {
		return () => a;
	};
	this.apply = (fab: IO<(a: A) => B>, io: IO<A>): IO<B> => {
		return () => fab()(io());
	};

	// Monad
	this.join = <C>(ioio: IO<IO<C>>): IO<C> => {
		return () => ioio()();
	};
	this.bind = (io: IO<A>, fab: (a: A) => IO<B>): IO<B> => {
		return this.join(this.fmap(fab, io));
	};

	// NOTE: TS apparently has trouble typing constructible functions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as IOFactory;
