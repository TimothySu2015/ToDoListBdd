using Microsoft.EntityFrameworkCore;
using ToDoListBDD.API.DomainEntities;

namespace ToDoListBDD.API.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<TodoTask> Tasks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // TodoTask 實體配置
        modelBuilder.Entity<TodoTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);
            entity.Property(e => e.IsCompleted)
                .HasDefaultValue(false);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP");
        });
    }
}