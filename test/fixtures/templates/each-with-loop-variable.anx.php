{{-- A template to test deep dot notation --}}
<h1>Cart Summary</h1>

@has($cart.items)
<p>Total items: {{ $cart.total_items }}</p>
<ul>
    @each ($cart.items as $item)
    <li>
        {{ $item.product.name }} - {{ $item.quantity }} pcs.
        @if ($item.product.is_digital)
        <em>(Digital Download)</em>
        @endif
    </li>
    @endeach
</ul>
@else
<p>Your cart is empty.</p>
@endhas
