import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './components/UserWarning';
import cn from 'classnames';
import { Todo } from './types/Todo';
import * as todoService from './api/todos';
import { getTodoStats } from './utils/todoStats';
import { ErrorMessageType } from './constants/ErrorMessageType';
import { Header } from './components/Header';
import { FilterType } from './constants/FilterType';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import { ErrorNotification } from './components/ErrorNotification';
import { focusInputField } from './utils/focus';

const ERROR_DISPLAY_TIMEOUT = 3000;

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [errorMessage, setErrorMessage] = useState<ErrorMessageType | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>(FilterType.All);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [activeTodo, setActiveTodo] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    todoService
      .getTodos()
      .then(setTodos)
      .catch(error => {
        setErrorMessage(ErrorMessageType.Load);

        throw error;
      })
      .finally(() => focusInputField(inputRef));
  }, []);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setErrorMessage(null);
    }, ERROR_DISPLAY_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [errorMessage]);

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  const {
    allTodosCount,
    activeTodosCount,
    completedTodosCount,
    visibleTodos,
    completedTodos,
  } = getTodoStats(todos, filter);

  const addTodo = async (newTodo: Omit<Todo, 'id'>) => {
    setLoading(true);
    setActiveTodo(0);
    setTempTodo({ ...newTodo, id: 0 });

    return todoService
      .addTodo(newTodo)
      .then(todo => {
        setTodos(current => [...current, todo]);
        setTempTodo(null);
      })
      .catch(error => {
        setErrorMessage(ErrorMessageType.Add);
        throw error;
      })
      .finally(() => {
        setTempTodo(null);
        setActiveTodo(null);
        setLoading(false);
        focusInputField(inputRef);
      });
  };

  const deleteTodo = (todoId: number) => {
    setLoading(true);
    setActiveTodo(todoId);

    todoService
      .deleteTodo(todoId)
      .then(() =>
        setTodos(current => current.filter(todo => todo.id !== todoId)),
      )
      .catch(() => {
        setErrorMessage(ErrorMessageType.Delete);
      })
      .finally(() => {
        setLoading(false);
        setActiveTodo(null);
        focusInputField(inputRef);
      });
  };

  const clearCompletedTodos = async () => {
    const results = await Promise.allSettled(
      completedTodos.map(todo =>
        todoService.deleteTodo(todo.id).then(() => todo.id),
      ),
    );

    const successfullIds = results
      .filter(res => res.status === 'fulfilled')
      .map(res => (res as PromiseFulfilledResult<number>).value);

    const hasError = results.some(res => res.status === 'rejected');

    if (hasError) {
      setErrorMessage(ErrorMessageType.Delete);
    }

    setTodos(current =>
      current.filter(todo => !successfullIds.includes(todo.id)),
    );

    setLoading(false);
    focusInputField(inputRef);
  };

  const isFooterVisible = allTodosCount > 0 || tempTodo !== null;

  return (
    <div className={cn('todoapp', { 'has-error': errorMessage })}>
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <Header
          onSubmit={addTodo}
          handleError={setErrorMessage}
          inputRef={inputRef}
          loading={loading}
        />

        <TodoList
          todos={visibleTodos}
          tempTodo={tempTodo}
          activeTodo={activeTodo}
          onDelete={deleteTodo}
        />

        {isFooterVisible && (
          <Footer
            activeCount={activeTodosCount}
            completedCount={completedTodosCount}
            filter={filter}
            onClearCompleted={clearCompletedTodos}
            onFilterChange={setFilter}
          />
        )}
      </div>

      <ErrorNotification
        errorMessage={errorMessage}
        onClose={setErrorMessage}
      />
    </div>
  );
};
