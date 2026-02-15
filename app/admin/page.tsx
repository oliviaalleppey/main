export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the Olivia Hotel Admin Panel.</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Total Bookings</h3>
                    <p className="text-2xl font-bold mt-2">0</p>
                    <p className="text-xs text-muted-foreground mt-1">+0% from last month</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Active Guests</h3>
                    <p className="text-2xl font-bold mt-2">0</p>
                    <p className="text-xs text-muted-foreground mt-1">Currently checked in</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Revenue</h3>
                    <p className="text-2xl font-bold mt-2">$0.00</p>
                    <p className="text-xs text-muted-foreground mt-1">+0% from last month</p>
                </div>
            </div>
        </div>
    );
}
