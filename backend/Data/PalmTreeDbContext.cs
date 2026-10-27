using Microsoft.EntityFrameworkCore;
using PalmTree.Api.Models;

namespace PalmTree.Api.Data;

public class PalmTreeDbContext : DbContext
{
    public PalmTreeDbContext(DbContextOptions<PalmTreeDbContext> options) : base(options)
    {}

    public DbSet<Workflow> Workflows => Set<Workflow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Workflow>(entity =>
        {
            entity.Property(w => w.NodesJson).HasColumnType("jsonb");
            entity.Property(w => w.EdgesJson).HasColumnType("jsonb");
        });
    }
}