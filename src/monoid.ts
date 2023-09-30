// NOTE: Only here to indicate that Semigroups should be parameterized by one type
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
export interface Semigroup<A> {}

export interface ISemigroup<A, S extends Semigroup<A>> {
	readonly concat: (s1: S, s2: S) => S;
}

// NOTE: Only here to indicate that Monoids should be parameterized by one type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Monoid<A> extends Semigroup<A> {}

export interface IMonoid<A, M extends Monoid<A>> extends ISemigroup<A, M> {
	readonly empty: () => M;
}
