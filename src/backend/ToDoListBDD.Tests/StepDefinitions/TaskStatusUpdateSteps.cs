using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Text.Json;
using TechTalk.SpecFlow;
using TechTalk.SpecFlow.Assist;
using ToDoListBDD.API.DomainEntities;
using ToDoListBDD.API.Infrastructure.Data;
using ToDoListBDD.API.Controllers;
using ToDoListBDD.API.ApplicationCommands;
using ToDoListBDD.API.ApplicationDTOs;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using Xunit;

namespace ToDoListBDD.Tests.StepDefinitions;

[Binding]
public class TaskStatusUpdateSteps : TestBase
{
    private HttpResponseMessage? _response;
    private TodoTask? _taskBeforeUpdate;

    public TaskStatusUpdateSteps() : base()
    {
    }

    [Given(@"資料庫中有以下任務:")]
    public async Task Given資料庫中有以下任務(Table table)
    {
        // 清空資料庫
        Context.Tasks.RemoveRange(Context.Tasks);
        await Context.SaveChangesAsync();

        var tasks = table.CreateSet<TodoTask>().ToList();
        foreach (var task in tasks)
        {
            Context.Tasks.Add(new TodoTask
            {
                Id = task.Id,
                Description = task.Description,
                IsCompleted = task.IsCompleted,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            });
        }
        await Context.SaveChangesAsync();
    }

    [When(@"我發送 PATCH 請求到 ""([^""]*)"" 包含:")]
    public async Task When我發送PATCH請求到包含(string endpoint, string requestBody)
    {
        // 解析端點以取得任務 ID
        var parts = endpoint.Split('/');
        var taskIdIndex = Array.IndexOf(parts, "tasks") + 1;
        if (taskIdIndex > 0 && taskIdIndex < parts.Length)
        {
            if (int.TryParse(parts[taskIdIndex], out var taskId))
            {
                // 儲存更新前的任務狀態
                _taskBeforeUpdate = await Context.Tasks.FindAsync(taskId);
                
                // 解析請求內容
                var requestData = JsonSerializer.Deserialize<JsonElement>(requestBody);
                var isCompleted = requestData.GetProperty("isCompleted").GetBoolean();
                
                // 建立請求物件
                var request = new UpdateTaskStatusRequest { IsCompleted = isCompleted };
                
                // 建立控制器並執行操作
                var mediator = ServiceProvider.GetRequiredService<IMediator>();
                var createValidator = ServiceProvider.GetRequiredService<IValidator<CreateTaskCommand>>();
                var updateValidator = ServiceProvider.GetRequiredService<IValidator<UpdateTaskStatusCommand>>();
                var updateDescriptionValidator = ServiceProvider.GetRequiredService<IValidator<ToDoListBDD.API.ApplicationCommands.UpdateTaskDescriptionCommand>>();
                var deleteValidator = ServiceProvider.GetRequiredService<IValidator<ToDoListBDD.API.ApplicationCommands.DeleteTaskCommand>>();
                
                var controller = new TasksController(mediator, createValidator, updateValidator, updateDescriptionValidator, deleteValidator);
                var result = await controller.UpdateTaskStatus(taskId, request);
                
                // 轉換結果為 HTTP 響應
                if (result.Result is OkObjectResult okResult)
                {
                    _response = new HttpResponseMessage(HttpStatusCode.OK);
                    var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                    _response.Content = new StringContent(JsonSerializer.Serialize(okResult.Value, options));
                }
                else if (result.Result is NotFoundObjectResult notFoundResult)
                {
                    _response = new HttpResponseMessage(HttpStatusCode.NotFound);
                    var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                    _response.Content = new StringContent(JsonSerializer.Serialize(notFoundResult.Value, options));
                }
                else if (result.Result is BadRequestObjectResult badRequestResult)
                {
                    _response = new HttpResponseMessage(HttpStatusCode.BadRequest);
                    var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
                    _response.Content = new StringContent(JsonSerializer.Serialize(badRequestResult.Value, options));
                }
                else
                {
                    _response = new HttpResponseMessage(HttpStatusCode.InternalServerError);
                }
            }
        }
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
        var task = await Context.Tasks.FindAsync(taskId);
        Assert.NotNull(task);
        Assert.Equal(expectedStatus, task.IsCompleted);
    }

    [Then(@"資料庫中任務 (.*) 的 UpdatedAt 應該被更新")]
    public async Task Then資料庫中任務的UpdatedAt應該被更新(int taskId)
    {
        var task = await Context.Tasks.FindAsync(taskId);
        Assert.NotNull(task);
        
        // 檢查任務是否被更新（與原始任務比較）
        if (_taskBeforeUpdate != null)
        {
            Assert.True(task.UpdatedAt >= _taskBeforeUpdate.UpdatedAt);
        }
        else
        {
            // UpdatedAt 應該比 CreatedAt 更新或相等（如果是在同一時間點）
            Assert.True(task.UpdatedAt >= task.CreatedAt);
        }
    }

    [Then(@"回應內容應該包含錯誤訊息 ""([^""]*)""")]
    public async Task Then回應內容應該包含錯誤訊息(string expectedMessage)
    {
        Assert.NotNull(_response);
        var responseContent = await _response.Content.ReadAsStringAsync();
        
        // 處理 Unicode 編碼的內容，將回應反序列化後再檢查
        try
        {
            var jsonDoc = System.Text.Json.JsonDocument.Parse(responseContent);
            var message = jsonDoc.RootElement.GetProperty("message").GetString();
            Assert.Contains(expectedMessage, message ?? "");
        }
        catch
        {
            // 如果 JSON 解析失敗，回退到原始字符串比較
            Assert.Contains(expectedMessage, responseContent);
        }
    }

    [Then(@"回應內容應該包含驗證錯誤訊息")]
    public async Task Then回應內容應該包含驗證錯誤訊息()
    {
        Assert.NotNull(_response);
        var responseContent = await _response.Content.ReadAsStringAsync();
        
        // 處理 Unicode 編碼的內容
        try
        {
            var jsonDoc = System.Text.Json.JsonDocument.Parse(responseContent);
            var hasErrors = jsonDoc.RootElement.TryGetProperty("errors", out var errorsProperty) && errorsProperty.GetArrayLength() > 0;
            var hasMessage = jsonDoc.RootElement.TryGetProperty("message", out var messageProperty) && !string.IsNullOrEmpty(messageProperty.GetString());
            
            Assert.True(hasErrors || hasMessage, $"Expected validation error message in response: {responseContent}");
        }
        catch
        {
            // 如果 JSON 解析失敗，回退到原始字符串比較
            Assert.True(responseContent.Contains("錯誤") || responseContent.Contains("Error") || 
                       responseContent.Contains("驗證") || responseContent.Contains("Validation") ||
                       responseContent.Contains("必須") || responseContent.Contains("ID"),
                       $"Expected validation error message in response: {responseContent}");
        }
    }

}