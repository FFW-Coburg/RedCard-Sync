<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserCreateCommand extends Command
{
    protected $signature = 'user:create
        {--name= : Name des Benutzers}
        {--email= : E-Mail-Adresse}
        {--password= : Passwort (min. 8 Zeichen)}';

    protected $description = 'Neuen Benutzer anlegen';

    public function handle(): int
    {
        $name = $this->option('name') ?? $this->ask('Name');
        $email = $this->option('email') ?? $this->ask('E-Mail');
        $password = $this->option('password') ?? $this->secret('Passwort (min. 8 Zeichen)');

        $validator = Validator::make(
            compact('name', 'email', 'password'),
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $this->info("Benutzer erfolgreich angelegt:");
        $this->table(
            ['ID', 'Name', 'E-Mail'],
            [[$user->id, $user->name, $user->email]]
        );

        return self::SUCCESS;
    }
}
