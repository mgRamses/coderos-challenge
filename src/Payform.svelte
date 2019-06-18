<script>
    let cardnumber = '';
    let name = '';
    let month = '';
    let year = '';
    let cardcolor = 'c__grey';
    let src = '';

    let onexists = 'oculto';
    let colortxt = 'black';
    let colorborde = '';
    let slash = 'oculto'

    $: firstNumber = cardnumber.slice(0,1);

    function validateForm(){
        if(cardnumber.length < 19 || cardnumber.length > 19){
            onexists = 'visible';
            colortxt = 'red';
            colorborde = 'redborder';
        }
    }
</script>

<style>
    h1{
        text-align: center;
    }
    .row{
        display: flex;
    }
    .column {
        flex: 50%;
        padding: 5px;
    }
    .column-date{
        float: left;
        -border: solid 1px orange;
        width: 180px;

    }
    .column-cvv{
        float: right;
        -border: solid 1px red;
        width: 100px;
    }
    .input-mes{
        width: 50px;
        float: left;
    }
    .input-year{
        width: 70px;
        float: right;
        margin-right: 40px;
    }
    .input-cvv{
        width: 70px;
    }
    .card{
        width: 90%;
        height: 180px;
        border-radius: 20px;
        margin: 0 auto;
        position: relative;
        padding: 10px;
    }
    .c__grey{
        background: grey;
    }
    .c__mc{background: rgb(172, 115, 11)}
    .c__visa{background: rgb(18, 155, 219)}
    .c__amex{background: rgb(131, 166, 177)}
    .card__data{
        color: white;
        position: absolute;
        bottom: 15px;
        height: 70px;
        -border: solid 1px white;
        width: 250px;
    }
    .card__number{
        position: absolute;
        top: 0;
        -border: solid 1px green;
    }
    .card__name{
        position: absolute;
        top: 25px;
        -border: solid 1px green;
    }
    .card__date{
        position: absolute;
        top: 50px;
        -border: solid 1px green;
    }
    .card__logo{
        max-width: 80px;
        position: absolute;
        right: 10px;
    }
    .btn-add{
        background: green;
        color: white;
        padding: 10px;
        text-align: center;
        cursor:pointer;
    }
    .oculto{
        display:none;
    }
    .visible{
        display:block;
        color: red;
    }
    .show{
        display: inline-block;
    }
    .red{
        color: red;
    }
    .black {
        color: black;
    }
    .redborder{
        border: 1px red solid;
    }
</style>

<h1>Nuevo método de pago</h1>
<div class="row">
    <div class="column">
        <div class="card {firstNumber == '4' ? 'c__visa' : firstNumber == '5' ? 'c__mc' :firstNumber == '3' ? 'c__amex' : 'c__grey'}">
            <img class="card__logo" src={firstNumber == '4' ? './visa.png' : firstNumber == '5' ? './mc.png' : firstNumber == '3' ? './amex.png' : ''} alt="" >
            <div class="card__data">
                <div class="card__number">{cardnumber}</div>
                <div class="card__name">{name}</div>
                <div class="card__date">
                    <span class="card__day">{month}</span> <span class={month != '' ? slash='show' : slash='oculto'}>/</span>
                    <span class="card__year">{year}</span>
                </div>
            </div>
        </div>
    </div>
    <div class="column">
        <form >
            <label class={colortxt}>Número de tarjeta</label>
            <input style="width:100%" type="text" bind:value={cardnumber} class={colorborde}> <div class={onexists}>El número es incorrecto</div>
            <label for="">Nombre del tarjetahabiente</label>
            <input style="width:100%" type="text" bind:value={name} >
            <div class="row">
                <div class="column-date">
                    <div>Fecha de vencimiento</div>
                    <input type="text" class="input-mes" bind:value={month}><input type="text" class="input-year" bind:value={year}>
                </div>
                <div class="column-cvv">
                    <span>Código CVV</span>
                    <input type="text" class="input-cvv">
                </div>
            </div>
            <div class="btn-add" on:click={validateForm}>agregar método de pago</div>
        </form>
    </div>
</div>