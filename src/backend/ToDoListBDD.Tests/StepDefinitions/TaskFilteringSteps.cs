using Xunit;
using TechTalk.SpecFlow;
using TechTalk.SpecFlow.Assist;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using ToDoListBDD.API.Infrastructure.Data;
using ToDoListBDD.API.DomainEntities;
using ToDoListBDD.API.ApplicationDTOs;
using ToDoListBDD.API.ApplicationQueries;
using Microsoft.EntityFrameworkCore;
using MediatR;

namespace ToDoListBDD.Tests.StepDefinitions;

[Binding]
public class TaskFilteringSteps
{
    private List<TaskDto>? _responseData;
    private readonly IServiceProvider _serviceProvider;
    private readonly ApplicationDbContext _context;
    private readonly IMediator _mediator;

    public TaskFilteringSteps()
    {
        var services = new ServiceCollection();
        
        // 添加 Logging
        services.AddLogging();
        
        // 使用 InMemory 資料庫，每個測試使用唯一資料庫
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}"));
        
        // 註冊 MediatR
        services.AddMediatR(cfg => 
            cfg.RegisterServicesFromAssembly(typeof(GetTasksQuery).Assembly));
        
        _serviceProvider = services.BuildServiceProvider();
        _context = _serviceProvider.GetRequiredService<ApplicationDbContext>();
        _mediator = _serviceProvider.GetRequiredService<IMediator>();
        
        // 確保資料庫已建立
        _context.Database.EnsureCreated();
    }

    [Given(@"系統中有以下任務：")]
    public async Task GivenSystemHasFollowingTasks(Table table)
    {
        // 清空現有任務
        _context.Tasks.RemoveRange(_context.Tasks);
        await _context.SaveChangesAsync();

        // 添加測試任務
        foreach (var row in table.Rows)
        {
            var description = row["描述"];
            var status = row["狀態"];
            var isCompleted = status == "已完成";

            var task = new TodoTask
            {
                Description = description,
                IsCompleted = isCompleted,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
        }

        await _context.SaveChangesAsync();
    }

    [Given(@"系統中沒有任務")]
    public async Task GivenSystemHasNoTasks()
    {
        // 清空所有任務
        _context.Tasks.RemoveRange(_context.Tasks);
        await _context.SaveChangesAsync();
    }

    [When(@"我請求狀態為 ""([^""]*)"" 的任務")]
    public async Task WhenIRequestTasksWithStatus(string status)
    {
        var query = new GetTasksQuery { Status = status };
        _responseData = await _mediator.Send(query);
    }

    [When(@"我請求任務而不指定狀態")]
    public async Task WhenIRequestTasksWithoutStatus()
    {
        var query = new GetTasksQuery { Status = null };
        _responseData = await _mediator.Send(query);
    }

    [Then(@"回應應該包含 (\d+) 個任務")]
    public void ThenResponseShouldContainTasks(int expectedCount)
    {
        Assert.NotNull(_responseData);
        Assert.Equal(expectedCount, _responseData.Count);
    }

    [Then(@"回應應該包含任務 ""([^""]*)""")]
    public void ThenResponseShouldContainTask(string taskDescription)
    {
        Assert.NotNull(_responseData);
        Assert.Contains(_responseData, task => task.Description == taskDescription);
    }

    [Then(@"回應不應該包含任務 ""([^""]*)""")]
    public void ThenResponseShouldNotContainTask(string taskDescription)
    {
        Assert.NotNull(_responseData);
        Assert.DoesNotContain(_responseData, task => task.Description == taskDescription);
    }

    [Then(@"回應應該包含所有任務")]
    public void ThenResponseShouldContainAllTasks()
    {
        Assert.NotNull(_responseData);
        Assert.Equal(4, _responseData.Count);
    }

    [Then(@"回應應該是空的任務列表")]
    public void ThenResponseShouldBeEmptyTaskList()
    {
        Assert.NotNull(_responseData);
        Assert.Empty(_responseData);
    }

    public void Dispose()
    {
        _context?.Dispose();
        if (_serviceProvider is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}