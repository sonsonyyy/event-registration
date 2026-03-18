<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

abstract class WorkflowNotification extends Notification
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * @return array{
     *     type: string,
     *     title: string,
     *     message: string,
     *     action_url: string,
     *     action_label: string,
     *     related_type: string,
     *     related_id: int,
     *     meta: array<string, mixed>
     * }
     */
    public function toArray(object $notifiable): array
    {
        return $this->payload();
    }

    /**
     * @return array{
     *     type: string,
     *     title: string,
     *     message: string,
     *     action_url: string,
     *     action_label: string,
     *     related_type: string,
     *     related_id: int,
     *     meta: array<string, mixed>
     * }
     */
    public function toDatabase(object $notifiable): array
    {
        return $this->payload();
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        $broadcastMessage = new BroadcastMessage($this->payload());

        if (config('queue.connections.deferred') !== null) {
            $broadcastMessage->onConnection('deferred');
        }

        return $broadcastMessage;
    }

    public function broadcastType(): string
    {
        return $this->payload()['type'];
    }

    /**
     * @return array{
     *     type: string,
     *     title: string,
     *     message: string,
     *     action_url: string,
     *     action_label: string,
     *     related_type: string,
     *     related_id: int,
     *     meta: array<string, mixed>
     * }
     */
    abstract protected function payload(): array;
}
