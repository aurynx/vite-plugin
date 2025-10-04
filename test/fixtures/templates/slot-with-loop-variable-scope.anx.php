<x-container>
    <h2>{{ $title }}</h2>
    @each ($items as $item)
    <p>{{ $item.name }}</p>
    @endEach
</x-container>
