using Microsoft.AspNetCore.Mvc;
using ToDoListBDD.API.Controllers;

namespace ToDoListBDD.Tests;

public class HealthControllerTests
{
    [Fact]
    public void Get_ShouldReturnHealthyStatus()
    {
        // Arrange
        var controller = new HealthController();

        // Act
        var result = controller.Get() as OkObjectResult;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(200, result.StatusCode);
        
        var responseValue = result.Value;
        Assert.NotNull(responseValue);
        
        // 使用反射檢查匿名物件的屬性
        var statusProperty = responseValue.GetType().GetProperty("Status");
        var timestampProperty = responseValue.GetType().GetProperty("Timestamp");
        
        Assert.NotNull(statusProperty);
        Assert.NotNull(timestampProperty);
        Assert.Equal("Healthy", statusProperty.GetValue(responseValue));
    }
}