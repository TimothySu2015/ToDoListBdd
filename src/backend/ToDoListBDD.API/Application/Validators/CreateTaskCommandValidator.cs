using FluentValidation;
using ToDoListBDD.API.ApplicationCommands;

namespace ToDoListBDD.API.Application.Validators;

public class CreateTaskCommandValidator : AbstractValidator<CreateTaskCommand>
{
    public CreateTaskCommandValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("請輸入任務描述")
            .MaximumLength(500).WithMessage("任務描述不能超過 500 字元");
    }
}