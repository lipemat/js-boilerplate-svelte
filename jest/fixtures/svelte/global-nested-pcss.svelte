<form class="form">
	<h3 class="title">
		Title
	</h3>
	<div class="b">
		<span class="d">
			B
		</span>
	</div>
	<div class="c">
		<span class="d">
			C
		</span>
	</div>
	<span class="e">
		E
	</span>
</form>
<div class="top">
	Top
</div>
<div class="x">
	<span class="y">
		Y
	</span>
</div>
<div class="z">
	<span class="w">
		W
	</span>
</div>
<div class="m">
	<span class="f">
		F
	</span>
	<span class="g">
		G
	</span>
</div>
<div class="h">
	H
</div>
<div class="list-global">
	List global
</div>
<div class="list-local">
	List local
</div>
<div class="outer">
	<div class="inner">
		<span class="leaf">
			Leaf
		</span>
	</div>
</div>
<button class="local-fn">
	Local function
</button>
<div class="outer-fn">
	<div class="inner-fn">
		<div class="leaf-fn">
			<span class="tail-fn">
				Tail
			</span>
		</div>
	</div>
</div>

<style lang="pcss">
	.form {
		:global {
			h3.title {
				color: red;
			}

			.b, .c {
				.d {
					color: blue;
				}
			}
		}

		&:hover :global .e {
			color: green;
		}
	}

	:global {
		.top {
			color: black;
		}
	}

	.x {
		:global .y {
			color: pink;
		}
	}

	.z {
		:global(.w) {
			color: gray;
		}
	}

	.m {
		@media (any-hover: hover) {
			&:hover :global .f {
				color: purple;
			}

			:global {
				.g {
					color: orange;
				}
			}
		}
	}

	@media (any-hover: hover) {
		:global {
			.h:hover {
				color: teal;
			}
		}
	}

	:global .list-global, .list-local {
		color: navy;
	}

	.outer :global .inner :local .leaf {
		color: olive;
	}

	:global {
		:local(.local-fn):not(div) {
			color: maroon;
		}
	}

	.outer-fn :global .inner-fn :local(.leaf-fn) .tail-fn {
		color: lime;
	}
</style>
