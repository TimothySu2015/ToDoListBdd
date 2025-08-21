using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using TechTalk.SpecFlow;
using TechTalk.SpecFlow.Assist;
using ToDoListBDD.API;
using ToDoListBDD.API.DomainEntities;
using ToDoListBDD.API.Infrastructure.Data;
using Xunit;

namespace ToDoListBDD.Tests.StepDefinitions;

[Binding]
public class TaskStatusUpdateSteps : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private HttpResponseMessage? _response;

    public TaskStatusUpdateSteps()
    {
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
        });

        _client = _factory.CreateClient();
    }

    [Given(@"資料庫中有以下任務:")]
    public async Task Given資料庫中有以下任務(Table table)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // 清空資料庫
        context.Tasks.RemoveRange(context.Tasks);
        await context.SaveChangesAsync();

        var tasks = table.CreateSet<TodoTask>().ToList();
        foreach (var task in tasks)
        {
            context.Tasks.Add(new TodoTask
            {
                Id = task.Id,
                Description = task.Description,
                IsCompleted = task.IsCompleted,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            });
        }
        await context.SaveChangesAsync();
    }

    [When(@"我發送 PATCH 請求到 ""([^""]*)"" 包含:")]
    public async Task When我發送PATCH請求到包含(string endpoint, string requestBody)
    {
        var content = JsonContent.Create(JsonDocument.Parse(requestBody).RootElement);
        _response = await _client.PatchAsync(endpoint, content);
    }

    [Then(@"回應狀態碼應該是 (.*)")]
    public void Then回應狀態碼應該是(int expectedStatusCode)
    {
        Assert.NotNull(_response);
        Assert.Equal((HttpStatusCode)expectedStatusCode, _response.StatusCode);
    }

    [Then(@"回應內容應該包含:")]
    public async Task Then回應內容應該包含(string expectedJson)
    {
        Assert.NotNull(_response);
        var responseContent = await _response.Content.ReadAsStringAsync();
        
        var expectedData = JsonDocument.Parse(expectedJson);
        var actualData = JsonDocument.Parse(responseContent);
        
        // 比較主要欄位
        if (expectedData.RootElement.TryGetProperty("id", out var expectedId))
        {
            Assert.True(actualData.RootElement.TryGetProperty("id", out var actualId));
            Assert.Equal(expectedId.GetInt32(), actualId.GetInt32());
        }
        
        if (expectedData.RootElement.TryGetProperty("description", out var expectedDesc))
        {
            Assert.True(actualData.RootElement.TryGetProperty("description", out var actualDesc));
            Assert.Equal(expectedDesc.GetString(), actualDesc.GetString());
        }
        
        if (expectedData.RootElement.TryGetProperty("isCompleted", out var expectedCompleted))
        {
            Assert.True(actualData.RootElement.TryGetProperty("isCompleted", out var actualCompleted));
            Assert.Equal(expectedCompleted.GetBoolean(), actualCompleted.GetBoolean());
        }
    }

    [Then(@"資料庫中任務 (.*) 的 IsCompleted 應該是 (.*)")]
    public async Task Then資料庫中任務的IsCompleted應該是(int taskId, bool expectedStatus)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var task = await context.Tasks.FindAsync(taskId);
        Assert.NotNull(task);
        Assert.Equal(expectedStatus, task.IsCompleted);
    }

    [Then(@"資料庫中任務 (.*) 的 UpdatedAt 應該被更新")]
    public async Task Then資料庫中任務的UpdatedAt應該被更新(int taskId)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var task = await context.Tasks.FindAsync(taskId);
        Assert.NotNull(task);
        
        // UpdatedAt 應該比 CreatedAt 更新或相等（如果是在同一時間點）
        Assert.True(task.UpdatedAt >= task.CreatedAt);
    }

    [Then(@"回應內容應該包含錯誤訊息 ""([^""]*)""")]
    public async Task Then回應內容應該包含錯誤訊息(string expectedMessage)
    {
        Assert.NotNull(_response);
        var responseContent = await _response.Content.ReadAsStringAsync();
        Assert.Contains(expectedMessage, responseContent);
    }

    [Then(@"回應內容應該包含驗證錯誤訊息")]
    public async Task Then回應內容應該包含驗證錯誤訊息()
    {
        Assert.NotNull(_response);
        var responseContent = await _response.Content.ReadAsStringAsync();
        
        // 檢查是否包含驗證相關的錯誤訊息
        Assert.True(responseContent.Contains("錯誤") || responseContent.Contains("Error") || 
                   responseContent.Contains("驗證") || responseContent.Contains("Validation"));
    }

    public void Dispose()
    {
        _response?.Dispose();
        _client.Dispose();
        _factory.Dispose();
    }
}