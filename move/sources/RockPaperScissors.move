module rock_paper_scissors_addr::rock_paper_scissors {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::timestamp;

     struct PlayerAccount has key {
        balance: u64,
    }

    // Game choices
    const ROCK: u8 = 0;
    const PAPER: u8 = 1;
    const SCISSORS: u8 = 2;

    // Game results
    const PLAYER_WINS: u8 = 0;
    const AI_WINS: u8 = 1;
    const DRAW: u8 = 2;

    struct GameState has key {
        games_played: u64,
        player_wins: u64,
        ai_wins: u64,
        draws: u64,
        last_game_result: LastGameResult,
    }

    struct LastGameResult has store, drop {
        player_choice: u8,
        ai_choice: u8,
        result: u8,
    }

    struct GameEvent has drop, store {
        player_address: address,
        player_choice: u8,
        ai_choice: u8,
        result: u8,
    }

    struct GameEventHandle has key {
        game_events: event::EventHandle<GameEvent>,
    }

    public entry fun initialize_game(account: &signer) {
        let account_addr = signer::address_of(account);
        if (!exists<GameState>(account_addr)) {
            move_to(account, GameState {
                games_played: 0,
                player_wins: 0,
                ai_wins: 0,
                draws: 0,
                last_game_result: LastGameResult {
                    player_choice: 3,
                    ai_choice: 3,
                    result: 3,
                },
            });
            move_to(account, GameEventHandle {
                game_events: account::new_event_handle<GameEvent>(account),
            });
        };
    }

    public entry fun play_game(account: &signer, player_choice: u8) acquires GameState, GameEventHandle {
        let account_addr = signer::address_of(account);
        assert!(exists<GameState>(account_addr), 1); // Game not initialized
        assert!(player_choice <= 2, 2); // Invalid choice

        let game_state = borrow_global_mut<GameState>(account_addr);
        
        let ai_choice = generate_ai_choice();
        let result = determine_winner(player_choice, ai_choice);

        game_state.games_played = game_state.games_played + 1;
        
        if (result == PLAYER_WINS) {
            game_state.player_wins = game_state.player_wins + 1;
        } else if (result == AI_WINS) {
            game_state.ai_wins = game_state.ai_wins + 1;
        } else {
            game_state.draws = game_state.draws + 1;
        };

        game_state.last_game_result = LastGameResult {
            player_choice,
            ai_choice,
            result,
        };

        // Emit game event
        let game_event_handle = borrow_global_mut<GameEventHandle>(account_addr);
        event::emit_event(&mut game_event_handle.game_events, GameEvent {
            player_address: account_addr,
            player_choice,
            ai_choice,
            result,
        });
    }

    fun generate_ai_choice(): u8 {
        let random_value = timestamp::now_microseconds() % 3;
        if (random_value == 0) { ROCK }
        else if (random_value == 1) { PAPER }
        else { SCISSORS }
    }

    fun determine_winner(player_choice: u8, ai_choice: u8): u8 {
        if (player_choice == ai_choice) {
            DRAW
        } else if (
            (player_choice == ROCK && ai_choice == SCISSORS) ||
            (player_choice == PAPER && ai_choice == ROCK) ||
            (player_choice == SCISSORS && ai_choice == PAPER)
        ) {
            PLAYER_WINS
        } else {
            AI_WINS
        }
    }

    #[view]
    public fun get_game_state(account_addr: address): (u64, u64, u64, u64, u8, u8, u8) acquires GameState {
        let game_state = borrow_global<GameState>(account_addr);
        (
            game_state.games_played,
            game_state.player_wins,
            game_state.ai_wins,
            game_state.draws,
            game_state.last_game_result.player_choice,
            game_state.last_game_result.ai_choice,
            game_state.last_game_result.result
        )
    }
}