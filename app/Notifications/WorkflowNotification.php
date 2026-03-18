<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

abstract class WorkflowNotification extends Notification
{
    use Queueable;

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
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
