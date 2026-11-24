<div class="a">
	<span class="b">
		B
	</span>
	<span class="c">
		C
	</span>
</div>

<style>
	.c {
		color: red;
	}

	.a :is(.b, .c) {
		color: blue;
	}
</style>
