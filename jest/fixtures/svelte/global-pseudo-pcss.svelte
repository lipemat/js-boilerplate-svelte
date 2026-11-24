<div class="strip-not">
	<span class="g-not">
		Not
	</span>
</div>
<div class="strip-not-fn">
	<span class="g-not-fn">
		Not function
	</span>
</div>
<div class="strip-nested">
	<span class="g-nested">
		Nested
	</span>
</div>
<div class="strip-has">
	<span class="g-has">
		Has
	</span>
</div>
<div class="strip-is g-is">
	Is
</div>
<div class="strip-amp">
	<span class="g-amp">
		Amp
	</span>
</div>
<p class="g-tag">
	Tag
</p>
<div class="wrap-is">
	<span class="g-wrap-is">
		Wrap is
	</span>
	<span class="local-is">
		Local is
	</span>
</div>
<div class="g-lead">
	<span class="wrap-lead">
		Lead
	</span>
</div>
<div class="wrap-where">
	<span class="g-where">
		Where
	</span>
</div>
<div class="wrap-local">
	<div class="g-local">
		<span class="local-leaf">
			Leaf
		</span>
	</div>
</div>
<section class="g-section">
	Section
</section>
<div class="wrap-fn">
	<span class="g-wrap-fn">
		Wrap function
	</span>
	<span class="local-fn">
		Local function
	</span>
</div>
<div>
	<span class="g-div-has">
		Div has
	</span>
</div>
<div class="wrap-fn-strip">
	<span class="g-fn-host">
		Function host
	</span>
</div>

<style lang="pcss">
	.strip-not:not(:global .g-not) {
		color: red;
	}

	.strip-not-fn:not(:global(.g-not-fn)) {
		color: red;
	}

	.strip-nested:not(:is(:global .g-nested)) {
		color: red;
	}

	.strip-has:has(:global .g-has) {
		color: red;
	}

	.strip-is:is(:global .g-is, :global(.g-is-fn)) {
		color: red;
	}

	.strip-amp {
		&:where(:global .g-amp) {
			color: red;
		}
	}

	p:not(:global .g-tag-not) {
		color: blue;
	}

	.wrap-is :is(:global .g-wrap-is, .local-is) {
		color: blue;
	}

	:is(:global .g-lead) .wrap-lead {
		color: blue;
	}

	.wrap-where :where(:global .g-where) {
		color: blue;
	}

	.wrap-local :is(:global .g-local :local .local-leaf) {
		color: blue;
	}

	section:not(:is(:global .g-section-not)) {
		color: blue;
	}

	.wrap-fn :is(:global(.g-wrap-fn), .local-fn) {
		color: blue;
	}

	div:has(:global .g-div-has) {
		color: blue;
	}

	.wrap-fn-strip :global(.g-fn-host:not(:global .g-fn-not)) {
		color: blue;
	}
</style>
