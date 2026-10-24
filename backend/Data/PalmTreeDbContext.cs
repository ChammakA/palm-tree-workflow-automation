using Microsoft.EntityFrameworkCore;
using PalmTree.Api.Models;

namespace PalmTree.Api.Data;

public class PalmTreeDbContext : DbContext
{
    public PalmTreeDbContext(DbContextOptions<PalmTreeDbContext> options) : base(options)
    {}

    public DbSet<Workflow> Workflows => Set<Workflow>();
}