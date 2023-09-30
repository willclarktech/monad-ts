// NOTE: Only here to indicate that Functors should be parameterized by one type
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface Functor<A> {}

export interface IFunctor<A, F extends Functor<A>, B, G extends Functor<B>> {
	readonly fmap: (fab: (a: A) => B, fa: F) => G;
}

// NOTE: Only here to indicate that Applicatives should be parameterized by one type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Applicative<A> extends Functor<A> {}

export interface IApplicative<
	A,
	F extends Applicative<A>,
	B,
	G extends Applicative<B>,
	H extends Applicative<(a: A) => B>,
> extends IFunctor<A, F, B, G> {
	readonly pure: (a: A) => F;
	readonly apply: (fab: H, fa: F) => G;
}

// NOTE: Only here to indicate that Monads should be parameterized by one type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Monad<A> extends Applicative<A> {}

export interface IMonad<
	A,
	F extends Monad<A>,
	FF extends Monad<Monad<A>>,
	B,
	G extends Monad<B>,
	H extends Applicative<(a: A) => B>,
> extends IApplicative<A, F, B, G, H> {
	readonly join: (ffa: FF) => F;
	readonly bind: (fa: F, fab: (a: A) => G) => G;
}
