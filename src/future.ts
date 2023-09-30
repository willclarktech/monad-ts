import type { IMonad } from "./monad";
import type { Writable } from "./util";

type Resolve<A> = (value: A) => void;

type Reject = (error: Error) => void;

type Executor<A> = (resolve: Resolve<A>, reject: Reject) => void;

enum FutureState {
	Pending,
	Fulfilled,
	Rejected,
}

interface Pending<A> {
	readonly state: FutureState.Pending;
	// eslint-disable-next-line functional/prefer-readonly-type
	readonly onFulfilledCallbacks: Resolve<A>[];
	// eslint-disable-next-line functional/prefer-readonly-type
	readonly onRejectedCallbacks: Reject[];
}

interface Fulfilled<A> {
	readonly state: FutureState.Fulfilled;
	readonly value: A;
}

interface Rejected {
	readonly state: FutureState.Rejected;
	readonly error: Error;
}

type Future<A> = Pending<A> | Fulfilled<A> | Rejected;

export interface IFuture<A, B>
	extends IMonad<
		A,
		Future<A>,
		Future<Future<A>>,
		B,
		Future<B>,
		Future<(a: A) => B>
	> {
	readonly pending: <C>() => Future<C>;
	readonly reject: <C>(error: Error, f?: Future<C>) => Future<C>;
	readonly resolve: <C>(value: C, f?: Future<C>) => Future<C>;
	readonly isPending: <C>(f: Future<C>) => f is Pending<C>;
	readonly isFulfilled: <C>(f: Future<C>) => f is Fulfilled<C>;
	readonly isRejected: <C>(f: Future<C>) => f is Rejected;
	readonly new: <C>(e: Executor<C>) => Future<C>;
	readonly then: <C>(
		resolve: (a: A) => C,
		f: Future<A>,
		reject?: (error: Error) => C,
	) => Future<C>;
	readonly catch: <C>(reject: (error: Error) => C, f: Future<A>) => Future<C>;
	readonly finally: (handler: () => void, f: Future<A>) => Future<A>;
	// Functor
	readonly fmap: <C>(fab: (a: A) => C, m: Future<A>) => Future<C>;
	// Applicative
	readonly pure: <C>(a: C) => Future<C>;
	readonly apply: (fab: Future<(a: A) => B>, m: Future<A>) => Future<B>;
	// Monad
	readonly join: <C>(mma: Future<Future<C>>) => Future<C>;
	readonly bind: (m: Future<A>, fab: (a: A) => Future<B>) => Future<B>;
}

type FutureFactory = { new <A, B>(): IFuture<A, B> };

export const Future: FutureFactory = function <A, B>(
	this: Writable<IFuture<A, B>>,
): void {
	this.pending = <C>(): Future<C> => ({
		state: FutureState.Pending,
		onFulfilledCallbacks: [],
		onRejectedCallbacks: [],
	});
	this.reject = <C>(error: Error, f?: Future<C>): Future<C> => {
		if (f !== undefined) {
			if (f.state !== FutureState.Pending) {
				return f;
			}
			f.onRejectedCallbacks.forEach((cb) => cb(error));
		}
		return {
			state: FutureState.Rejected,
			error,
		};
	};
	this.resolve = <C>(value: C, f?: Future<C>): Future<C> => {
		if (f !== undefined) {
			if (f.state !== FutureState.Pending) {
				return f;
			}
			f.onFulfilledCallbacks.forEach((cb) => cb(value));
		}
		return {
			state: FutureState.Fulfilled,
			value,
		};
	};
	this.isPending = <C>(f: Future<C>): f is Pending<C> =>
		f.state === FutureState.Pending;
	this.isFulfilled = <C>(f: Future<C>): f is Fulfilled<C> =>
		f.state === FutureState.Fulfilled;
	this.isRejected = <C>(f: Future<C>): f is Rejected =>
		f.state === FutureState.Rejected;
	this.new = <C>(e: Executor<C>): Future<C> => {
		const f = this.pending<C>();
		try {
			e(
				(value) => this.resolve(value, f),
				(error) => this.reject(error, f),
			);
			return f;
		} catch (error) {
			const errorToThrow =
				error instanceof Error ? error : new Error("Unrecognized error");
			return this.reject(errorToThrow, f);
		}
	};
	this.then = <C, D>(
		resolve: (a: A) => C,
		f: Future<A>,
		reject?: (error: Error) => D,
	): Future<typeof reject extends undefined ? C : C | D> => {
		const g = this.pending<C | D>();
		switch (f.state) {
			case FutureState.Pending:
				// eslint-disable-next-line functional/immutable-data
				f.onFulfilledCallbacks.push((value) => this.resolve(resolve(value), g));
				if (reject !== undefined) {
					// eslint-disable-next-line functional/immutable-data
					f.onRejectedCallbacks.push((error) => this.resolve(reject(error), g));
				}
				break;
			case FutureState.Fulfilled:
				this.resolve(resolve(f.value), g);
				break;
			case FutureState.Rejected:
				if (reject !== undefined) {
					this.resolve(reject(f.error), g);
				}
				break;
		}
		return g;
	};
	this.catch = <C>(reject: (error: Error) => C, f: Future<A>): Future<C> => {
		const g = this.pending<C>();
		switch (f.state) {
			case FutureState.Pending:
				// eslint-disable-next-line functional/immutable-data
				f.onRejectedCallbacks.push((error) => this.resolve(reject(error), g));
				break;
			case FutureState.Fulfilled:
				break;
			case FutureState.Rejected:
				this.resolve(reject(f.error), g);
				break;
		}
		return g;
	};
	this.finally = (handler: () => void, f: Future<A>): Future<A> => {
		const g = this.pending<A>();
		const handlerWrapped = () => {
			try {
				handler();
			} catch {
				// Do nothing
			}
		};
		const onFulfilled = (v: A): void => {
			handlerWrapped();
			this.resolve(v, g);
		};
		const onRejected = (e: Error): void => {
			handlerWrapped();
			this.reject(e, g);
		};
		switch (f.state) {
			case FutureState.Pending:
				// eslint-disable-next-line functional/immutable-data
				f.onFulfilledCallbacks.push((a) => {
					onFulfilled(a);
				});
				// eslint-disable-next-line functional/immutable-data
				f.onRejectedCallbacks.push((error) => {
					onRejected(error);
				});
				break;
			case FutureState.Fulfilled:
				onFulfilled(f.value);
				break;
			case FutureState.Rejected:
				onRejected(f.error);
				break;
		}
		return g;
	};
	// Functor
	this.fmap = this.then;
	// // Applicative
	this.pure = this.resolve;
	this.apply = <C>(fab: Future<(a: A) => C>, f: Future<A>): Future<C> => {
		const g = this.pending<C>();
		this.then(
			(a) =>
				new Future<(a: A) => C, unknown>().then(
					(fun) => this.resolve(fun(a), g),
					fab,
				),
			f,
		);
		return g;
	};
	this.join = <C>(f: Future<Future<C>>): Future<C> => {
		const flattened = this.pending<C>();
		new Future<Future<C>, unknown>().then(
			(innerFuture) => {
				new Future<C, A>().then(
					(value) => {
						this.resolve(value, flattened);
					},
					innerFuture,
					(error) => {
						this.reject(error, flattened);
					},
				);
			},
			f,
			(error) => {
				this.reject(error, flattened);
			},
		);
		return flattened;
	};
	this.bind = (m: Future<A>, fab: (a: A) => Future<B>): Future<B> =>
		this.join(this.fmap(fab, m));

	// NOTE: TS apparently has trouble typing constructible functions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as FutureFactory;
