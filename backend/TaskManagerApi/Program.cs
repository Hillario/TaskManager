using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

//CORS POLICY ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // Direct access for your frontend
              .AllowAnyMethod()                     // Allows GET, POST, PUT, DELETE
              .AllowAnyHeader();                    // Allows Content-Type, Authorization, etc.
    });
});

// 1. Configure Services (DI)
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite("Data Source=tasks.db"));
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("").AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();


// 2. Configure Pipeline (Middleware)
app.UseCors("AllowAngularApp");

// 3. CRUD Endpoints (Minimal APIs)
app.MapGet("/api/tasks", async (AppDbContext db) => 
    await db.Tasks.ToListAsync());

app.MapGet("/api/tasks/{id}", async (int id, AppDbContext db) =>
    await db.Tasks.FindAsync(id) is ProjectTask task ? Results.Ok(task) : Results.NotFound());

app.MapPost("/api/tasks", async (ProjectTask task, AppDbContext db) =>
{
    db.Tasks.Add(task);
    await db.SaveChangesAsync();
    return Results.Created($"/api/tasks/{task.Id}", task);
});

app.MapPut("/api/tasks/{id}", async (int id, ProjectTask inputTask, AppDbContext db) =>
{
    var task = await db.Tasks.FindAsync(id);
    if (task is null) return Results.NotFound();

    task.Title = inputTask.Title;
    task.IsCompleted = inputTask.IsCompleted;
    task.Priority = inputTask.Priority;
    task.CompletionDate = inputTask.CompletionDate;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

app.MapDelete("/api/tasks/{id}", async (int id, AppDbContext db) =>
{
    if (await db.Tasks.FindAsync(id) is ProjectTask task)
    {
        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return Results.Ok(task);
    }
    return Results.NotFound();
});

app.Run();

// 4. Data Models & Context
public class ProjectTask
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateOnly? CompletionDate { get; set; }
}

public enum TaskPriority
{
    Low,
    Medium,
    High
}

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<ProjectTask> Tasks => Set<ProjectTask>();
}