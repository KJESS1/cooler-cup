module cooler_cup::game_escrow {
    // FIX: Imported missing fundamental types so the compiler understands UID, transfer, and TxContext
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};

    const EGameFull: u64 = 0;
    const EWrongStake: u64 = 1;
    const EGameNotFull: u64 = 2;
    const EAlreadyResolved: u64 = 3;
    const EInvalidWinner: u64 = 4;

    /// Held by your house/admin wallet — only it can resolve games.
    public struct AdminCap has key { id: UID }

    /// A single 1v1 wagered game (or a prediction vs the House).
    public struct Game has key {
        id: UID,
        player_one: address,
        player_two: address,
        stake: u64,
        pot: Balance<SUI>,
        resolved: bool,
    }

    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    }

    /// Player one creates a game, staking `stake_coin`.
    public entry fun create_game(stake_coin: Coin<SUI>, ctx: &mut TxContext) {
        let stake = coin::value(&stake_coin);
        let game = Game {
            id: object::new(ctx),
            player_one: ctx.sender(),
            player_two: @0x0,
            stake,
            pot: coin::into_balance(stake_coin),
            resolved: false,
        };
        transfer::share_object(game);
    }

    /// Player two (or the House, for predictions) matches the stake to join.
    public entry fun join_game(game: &mut Game, stake_coin: Coin<SUI>, ctx: &mut TxContext) {
        assert!(game.player_two == @0x0, EGameFull);
        assert!(coin::value(&stake_coin) == game.stake, EWrongStake);
        game.player_two = ctx.sender();
        balance::join(&mut game.pot, coin::into_balance(stake_coin));
    }

    /// Admin (your backend) resolves the game and pays the full pot to the winner.
    public entry fun resolve_game(_admin: &AdminCap, game: &mut Game, winner: address, ctx: &mut TxContext) {
        assert!(!game.resolved, EAlreadyResolved);
        assert!(game.player_two != @0x0, EGameNotFull);
        assert!(winner == game.player_one || winner == game.player_two, EInvalidWinner);

        let amount = balance::value(&game.pot);
        let payout = coin::take(&mut game.pot, amount, ctx);
        transfer::public_transfer(payout, winner);
        game.resolved = true;
    }
}
