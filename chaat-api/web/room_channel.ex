defmodule Chaat.RoomChannel do
  use Chaat.Web, :channel

  def join("room:global", _message, socket) do
    {:ok, socket}
  end
  def join(_room, _message, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def terminate(_reason, _socket) do
    :ok
  end

  def handle_in("new:message", msg, socket) do
    case Map.has_key?(socket.assigns, :current_user) do
      true ->
        broadcast! socket, "new:message", %{body: msg["body"]}
        {:noreply, socket}
      false ->
        {:reply, {:error, %{reason: "unauthorized"}}, socket}
    end
  end
end