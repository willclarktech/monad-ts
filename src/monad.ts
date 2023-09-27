export interface Functor<A> {
	fmap<B>(f: (a: A) => B): Functor<B>;
}

export interface Applicative<A> extends Functor<A> {
	// pure should be a static method on the class
	apply<B>(fab: Applicative<(a: A) => B>): Applicative<B>;
}

export interface Monad<A> extends Applicative<A> {
	// TODO: Figure out if it is even possible to enforce join using TS
	// join should be a static method on the class
	bind<B>(f: (a: A) => Monad<B>): Monad<B>;
}
