<x-layout title="User List Page">
    {{-- This is a template to showcase the new dot notation and directives. --}}
    <h1>User List</h1>

    @has($users)
    <div class="user-grid">
        @each ($users as $user)
        <div class="user-card">
            @if ($user.status === 'active')
            <strong class="status--active">{{ $user.name }}</strong>
            @elseif ($user.status === 'pending')
            <em class="status--pending">{{ $user.name }} (Pending Review)</em>
            @else
            {{-- Using raw echo for demonstration --}}
            <del class="status--inactive">{{{ $user.name }}} (Banned)</del>
            @endif
        </div>
        @endeach
    </div>
    @else
    <p>No users found.</p>
    @endhas
</x-layout>
