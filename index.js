const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#score');
const startGameBtn = document.querySelector('#startGameBtn');
const modelEl = document.querySelector('#modelEl');
const stats = document.querySelector('#stats');

class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fill();
    }
}

class Base {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;

    }
}

class Projectile extends Base {

}

class Enemy extends Base {

}


const friction = 0.99;
class Particle extends Base {
    constructor(x, y, radius, color, velocity) {
        super(x, y, radius, color, velocity);
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true)
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01

    }



}

let x = innerWidth / 2
let y = innerHeight / 2

let player;
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
    player = new Player(x, y, 20, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
}

function spawnEnemies() {
    setInterval(() => {

        let x;
        let y;
        const radius = Math.random() * (30 - 5) + 5;

        //generating random spawn point on edges of window
        if (Math.random() < 0.5) {
         
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;

        } else {
           
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }

        //generating random color for enemy
        const color = `hsl(${Math.random() * 360},50%,50%)`;

        //Calculating angle between enemy and center point of the window
        const angle = Math.atan2(canvas.height / 2 - y,
            canvas.width / 2 - x);
        
        //Calculating velocity to direct enemy to center point
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

let animationId;
let score = 0;
function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();

    particles.forEach((particle, particleIndex) => {
        //if particle's opacity is zero then remove it
        if (particle.alpha <= 0) {
            setTimeout(() => {
                particles.splice(particleIndex, 1);
            }, 0);

        } else {
            particle.update();
        }
    })

    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();

        //if projectile is out of the screen then remove it
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(projectileIndex, 1);
            }, 0);

        }


    });


    enemies.forEach((enemy, index) => {
        enemy.update();

        //if enemy touches player
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist - enemy.radius - player.radius < 1) {
            //stop the game and show result screen with score
            cancelAnimationFrame(animationId);
            modelEl.style.display = 'flex';
            stats.innerHTML = score;
        }

        projectiles.forEach((projectile, projectileIndex) => {
            //if projectile touches enemy
            const dist = Math.hypot(projectile.x - enemy.x,
                projectile.y - enemy.y);
            if (dist - enemy.radius - projectile.radius < 1) {
                
                //make particle effect
                for (let i = 0; i < enemy.radius; i++) {
                    //generating random radius and velocity for each particle
                    particles.push(new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 2,
                        enemy.color,
                        {
                            x: (Math.random() - 0.5) * (Math.random() * 8),
                            y: (Math.random() - 0.5) * (Math.random() * 8)
                        }
                    ));

                }

                //if the enemy is big enough then shrink enemy size
                if (enemy.radius - 10 > projectile.radius) {
                    score += 100;
                    scoreEl.innerHTML = score;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);

                } else {
                    //if not remove it from screen
                    score += 250;
                    scoreEl.innerHTML = score;
                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }

            }

        });

    });

}


addEventListener('click', (e) => {
    //Calculating angle between click point and center point of the window
    const angle = Math.atan2(e.clientY - canvas.height / 2,
        e.clientX - canvas.width / 2);

    //Calculating velocity to direct projectile to click point
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    const projectile = new Projectile(
        canvas.width / 2,
        canvas.height / 2,
        5,
        'white',
        velocity
    );
    projectiles.push(projectile);



});

addEventListener('resize', () => {
    //if window resized calculate the center point
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    x = innerWidth / 2;
    y = innerHeight / 2;
    player.x = x;
    player.y = y;
   
});



startGameBtn.addEventListener('click', () => {
    //When start button clicked reset everything and restart game
    init();
    modelEl.style.display = 'none';
    animate();
    spawnEnemies();
})