import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor() {
        super(
            'Мирная утка',
            2,
            'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Volodymyr_Zelenskyy_in_2022.jpg/640px-Volodymyr_Zelenskyy_in_2022.jpg'
        );
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(
        name = 'Пес-бандит',
        maxPower = 3,
        image = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%9F%D1%83%D1%82%D0%B8%D0%BD_%2808-03-2024%29_%28cropped%29_%28higher_res%29.jpg/800px-%D0%92%D0%BB%D0%B0%D0%B4%D0%B8%D0%BC%D0%B8%D1%80_%D0%9F%D1%83%D1%82%D0%B8%D0%BD_%2808-03-2024%29_%28cropped%29_%28higher_res%29.jpg'
    ) {
        super(name, maxPower, image);
    }
}

class Trasher extends Dog {
    constructor() {
        super(
            'Громила',
            5,
            'https://img2.fedpress.ru/thumbs/480x480/2023/05/25/24d44957623fa939889b7b6a2d1bfa46.jpg'
        );
    }

    modifyTakenDamage(value, toCard, gameContext, continuation) {
        this.view.signalAbility(() => continuation(value - 1));
    }

    getDescriptions() {
        return [
            ...super.getDescriptions(),
            'если Громилу атакуют, то он получает на 1 меньше урона.',
        ];
    }
}

class Gatling extends Creature {
    constructor() {
        super(
            'Гатлинг',
            6,
            'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Benjamin_Netanyahu%2C_February_2023.jpg/1200px-Benjamin_Netanyahu%2C_February_2023.jpg'
        );
    }

    getDescriptions() {
        return [...super.getDescriptions(), 'Нехорошо нападать на мирных жителей. Это еще может быть опасно, если в сарае припрятан Гатлинг.'];
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { currentPlayer, oppositePlayer, position, updateView } =
            gameContext;

        taskQueue.push((onDone) => this.view.showAttack(onDone));

        for (
            let position = 0;
            position < oppositePlayer.table.length;
            position++
        ) {
            taskQueue.push((onDone) => {
                const oppositeCard = oppositePlayer.table[position];

                if (oppositeCard) {
                    this.dealDamageToCreature(
                        this.currentPower,
                        oppositeCard,
                        gameContext,
                        onDone
                    );
                }
            });
        }

        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor() {
        super(
            'Браток',
            2,
            'https://upload.wikimedia.org/wikipedia/commons/8/83/TrumpPortrait.jpg'
        );
    }

    getDescriptions() {
        return [...super.getDescriptions(), 'Чем их больше, тем они сильнее.'];
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } =
            gameContext;
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    static getBonus() {
        const count = this.getInGameCount();
        return (count * (count + 1)) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Math.min(0, Lad.getBonus()));
    }
}

const seriffStartDeck = [new Duck(), new Duck(), new Duck(), new Duck(), new Gatling()];
const banditStartDeck = [new Dog(), new Trasher(), new Lad(), new Lad()];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(2);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
