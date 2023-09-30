import type { IMonad } from "./monad";
import type { Writable } from "./util";

export type Nothing = {
	readonly isNothing: true;
};

export type Just<A> = {
	readonly isNothing: false;
	readonly value: A;
};

export type Maybe<A> = Nothing | Just<A>;

export interface IMaybe<A, B>
	extends IMonad<
		A,
		Maybe<A>,
		Maybe<Maybe<A>>,
		B,
		Maybe<B>,
		Maybe<(a: A) => B>
	> {
	readonly nothing: <C>() => Maybe<C>;
	readonly just: <C>(c: C) => Maybe<C>;
	readonly isNothing: <C>(c: Maybe<C>) => c is Nothing;
	readonly isJust: <C>(c: Maybe<C>) => c is Just<C>;
	/** Impure but useful */
	readonly fromJust: (a: Maybe<A>) => A;
	// Functor
	readonly fmap: <C>(fab: (a: A) => C, m: Maybe<A>) => Maybe<C>;
	// Applicative
	readonly pure: <C>(a: C) => Maybe<C>;
	readonly apply: (fab: Maybe<(a: A) => B>, m: Maybe<A>) => Maybe<B>;
	// Monad
	readonly join: <C>(mma: Maybe<Maybe<C>>) => Maybe<C>;
	readonly bind: (m: Maybe<A>, fab: (a: A) => Maybe<B>) => Maybe<B>;
}

type MaybeFactory = { new <A, B>(): IMaybe<A, B> };

export const Maybe: MaybeFactory = function <A, B>(
	this: Writable<IMaybe<A, B>>,
): void {
	this.nothing = <C>(): Maybe<C> => ({ isNothing: true });
	this.just = <C>(c: C): Maybe<C> => ({ isNothing: false, value: c });
	this.isNothing = <C>(c: Maybe<C>): c is Nothing => c.isNothing;
	this.isJust = <C>(c: Maybe<C>): c is Just<C> => !c.isNothing;
	this.fromJust = (a: Maybe<A>): A => {
		if (this.isNothing(a)) {
			throw new Error("Cannot retrieve value from Nothing");
		}
		return a.value;
	};

	// Functor
	this.fmap = <C>(fab: (a: A) => C, m: Maybe<A>): Maybe<C> =>
		this.isJust(m) ? this.just(fab(m.value)) : this.nothing();

	// Applicative
	this.pure = this.just;
	this.apply = <C>(fab: Maybe<(a: A) => C>, m: Maybe<A>): Maybe<C> =>
		this.isJust(fab) && this.isJust(m)
			? this.just(fab.value(m.value))
			: this.nothing();

	// Monad
	this.join = <C>(m: Maybe<Maybe<C>>): Maybe<C> =>
		this.isJust(m) ? m.value : this.nothing();
	this.bind = (m: Maybe<A>, fab: (a: A) => Maybe<B>): Maybe<B> =>
		this.join(this.fmap(fab, m));

	// NOTE: TS apparently has trouble typing constructible functions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as MaybeFactory;
