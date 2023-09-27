import type { Monad } from "./monad";

enum FutureState {
	Pending,
	Fulfilled,
	Rejected,
}

interface Pending {
	readonly state: FutureState.Pending;
}

interface Fulfilled<A> {
	readonly state: FutureState.Fulfilled;
	readonly value: A;
}

interface Rejected {
	readonly state: FutureState.Rejected;
	readonly error: Error;
}

type FutureData<A> = Pending | Fulfilled<A> | Rejected;

type Resolve<A> = (value: A) => void;

type Reject = (error: Error) => void;

type Executor<A> = (resolve: Resolve<A>, reject: Reject) => void;

export class Future<A> implements Monad<A> {
	// eslint-disable-next-line functional/prefer-readonly-type
	private readonly onFulfilledCallbacks: Resolve<A>[] = [];
	// eslint-disable-next-line functional/prefer-readonly-type
	private readonly onRejectedCallbacks: Reject[] = [];

	// eslint-disable-next-line functional/prefer-readonly-type
	private constructor(public data: FutureData<A>) {}

	private static pending<B>(): Future<B> {
		return new Future({ state: FutureState.Pending });
	}

	public static reject<B>(error: Error): Future<B> {
		return new Future({ state: FutureState.Rejected, error });
	}

	public static resolve<B>(value: B): Future<B> {
		return new Future({ state: FutureState.Fulfilled, value });
	}

	public isPending(): this is { readonly data: Pending } {
		return this.data.state === FutureState.Pending;
	}

	public isFulfilled(): this is { readonly data: Fulfilled<A> } {
		return this.data.state === FutureState.Fulfilled;
	}

	public isRejected(): this is { readonly data: Rejected } {
		return this.data.state === FutureState.Rejected;
	}

	private reject(error: Error): Future<A> {
		if (this.data.state === FutureState.Pending) {
			this.data = {
				state: FutureState.Rejected,
				error,
			};
			this.onRejectedCallbacks.forEach((cb) => cb(error));
		}
		return this;
	}

	private resolve(value: A): Future<A> {
		if (this.data.state === FutureState.Pending) {
			this.data = {
				state: FutureState.Fulfilled,
				value,
			};
			this.onFulfilledCallbacks.forEach((cb) => cb(value));
		}
		return this;
	}

	public static new<B>(f: Executor<B>): Future<B> {
		const future = Future.pending<B>();
		try {
			f(future.resolve.bind(future), future.reject.bind(future));
			return future;
		} catch (error) {
			const errorToThrow =
				error instanceof Error ? error : new Error("Unrecognized error");
			return Future.reject(errorToThrow);
		}
	}

	public then<B>(f: (a: A) => B, g?: (error: Error) => B): Future<B> {
		const future = Future.pending<B>();
		this.onFulfilledCallbacks.push((a) => future.resolve(f(a)));
		if (g !== undefined) {
			this.onRejectedCallbacks.push((error) => future.resolve(g(error)));
		}
		return future;
	}

	public catch<B>(f: (error: Error) => B): Future<B> {
		const future = Future.pending<B>();
		this.onRejectedCallbacks.push((error) => future.resolve(f(error)));
		return future;
	}

	public finally(f: () => void): Future<A> {
		const future = Future.pending<A>();
		const fWrapped = () => {
			try {
				f();
			} catch {
				// Do nothing
			}
		};
		this.onFulfilledCallbacks.push((a) => {
			fWrapped();
			future.resolve(a);
		});
		this.onRejectedCallbacks.push((error) => {
			fWrapped();
			future.reject(error);
		});
		return future;
	}

	public fmap = this.then.bind(this);

	public static pure = Future.resolve.bind(Future);

	public apply<B>(fab: Future<(a: A) => B>): Future<B> {
		const future = Future.pending<B>();

		this.then((a) => {
			fab.then((f) => future.resolve(f(a)));
		});

		return future;
	}

	public static join<B>(future: Future<Future<B>>): Future<B> {
		const flattened = Future.pending<B>();

		future.then(
			(innerFuture) => {
				innerFuture.then(
					(value) => {
						flattened.resolve(value);
					},
					(error) => {
						flattened.reject(error);
					},
				);
			},
			(error) => {
				flattened.reject(error);
			},
		);

		return flattened;
	}

	public bind<B>(f: (a: A) => Future<B>): Future<B> {
		return Future.join(this.fmap(f));
	}
}
