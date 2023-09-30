export interface Semigroup<A> {
	concat(semigroup: Semigroup<A>): Semigroup<A>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Monoid<A> extends Semigroup<A> {
	// empty should be a static method on the class
}
