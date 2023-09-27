import { Future } from "./future";
import { List } from "./list";
import { Maybe } from "./maybe";
import { Functor } from "./monad";

// NOTE: This isn't that useful because TS doesn't support kind polymorphism
export type NaturalTransformation<
	A,
	F extends Functor<A>,
	G extends Functor<A>,
> = (f: F) => G;

export const maybe2Future = <A>(maybe: Maybe<A>): Future<A> =>
	maybe.isJust()
		? Future.pure(maybe.fromJust())
		: // NOTE: You might instead want to make a pending future if no value is available
		  Future.reject(new Error("Missing value"));

export const future2Maybe = <A>(future: Future<A>): Maybe<A> =>
	future.isFulfilled() ? Maybe.pure(future.data.value) : Maybe.nothing();

export const maybe2List = <A>(maybe: Maybe<A>): List<A> =>
	maybe.isJust() ? List.pure(maybe.fromJust()) : List.nil();

export const list2Maybe = <A>(list: List<A>): Maybe<A> =>
	// NOTE: You might instead want to put the whole list in a just and never return nothing here
	list.length > 0 ? Maybe.pure(list.head()) : Maybe.nothing();

export const future2List = <A>(future: Future<A>): List<A> =>
	future.isFulfilled() ? List.pure(future.data.value) : List.nil();

export const list2Future = <A>(list: List<A>): Future<A> =>
	// NOTE: You might instead what to resolve the whole list and never reject here
	list.length > 0
		? Future.pure(list.head())
		: Future.reject(new Error("Empty list"));
