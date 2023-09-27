import { Monad } from "./monad";

interface Nothing {
	readonly isNothing: true;
}

interface Just<A> {
	readonly isNothing: false;
	readonly value: A;
}

type MaybeData<A> = Nothing | Just<A>;

export class Maybe<A> implements Monad<A> {
	private constructor(public readonly data: MaybeData<A>) {}

	public static nothing<B>(): Maybe<B> {
		return new Maybe({ isNothing: true });
	}

	public static just<B>(value: B): Maybe<B> {
		return new Maybe({ isNothing: false, value });
	}

	public isNothing(): this is { readonly data: Nothing } {
		return this.data.isNothing;
	}

	public isJust(): this is { readonly data: Just<A> } {
		return !this.data.isNothing;
	}

	public fromJust(): A {
		if (this.isJust()) {
			return this.data.value;
		}
		throw new Error("Cannot retrieve value from Nothing");
	}

	public fmap<B>(f: (a: A) => B): Maybe<B> {
		return this.isJust() ? Maybe.just(f(this.data.value)) : Maybe.nothing();
	}

	public static pure = Maybe.just;

	public apply<B>(fab: Maybe<(a: A) => B>): Maybe<B> {
		return fab.isJust() && this.isJust()
			? Maybe.just(fab.data.value(this.data.value))
			: Maybe.nothing();
	}

	public static join<B>(maybe: Maybe<Maybe<B>>): Maybe<B> {
		return maybe.isJust() ? maybe.data.value : Maybe.nothing();
	}

	public bind<B>(f: (a: A) => Maybe<B>): Maybe<B> {
		return Maybe.join(this.fmap(f));
	}
}
