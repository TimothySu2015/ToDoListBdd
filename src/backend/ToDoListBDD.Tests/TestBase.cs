using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ToDoListBDD.API.Infrastructure.Data;
using MediatR;
using ToDoListBDD.API.ApplicationCommands;
using FluentValidation;

namespace ToDoListBDD.Tests;

public abstract class TestBase : IDisposable
{
    protected readonly IServiceProvider ServiceProvider;
    protected readonly ApplicationDbContext Context;

    protected TestBase()
    {
        var services = new ServiceCollection();
        
        // 添加 Logging
        services.AddLogging();
        
        // 使用 InMemory 資料庫，每個測試使用唯一資料庫
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}"));
        
        // 註冊 MediatR
        services.AddMediatR(cfg => 
            cfg.RegisterServicesFromAssembly(typeof(CreateTaskCommand).Assembly));
        
        // 註冊所有驗證器
        services.AddTransient<IValidator<CreateTaskCommand>, 
            ToDoListBDD.API.Application.Validators.CreateTaskCommandValidator>();
        services.AddTransient<IValidator<ToDoListBDD.API.ApplicationCommands.UpdateTaskStatusCommand>, 
            ToDoListBDD.API.Application.Validators.UpdateTaskStatusCommandValidator>();
        services.AddTransient<IValidator<ToDoListBDD.API.ApplicationCommands.UpdateTaskDescriptionCommand>, 
            ToDoListBDD.API.Application.Validators.UpdateTaskDescriptionCommandValidator>();
        services.AddTransient<IValidator<ToDoListBDD.API.ApplicationCommands.DeleteTaskCommand>, 
            ToDoListBDD.API.Application.Validators.DeleteTaskCommandValidator>();
        
        ServiceProvider = services.BuildServiceProvider();
        Context = ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // 確保資料庫已建立
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context?.Dispose();
        if (ServiceProvider is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}