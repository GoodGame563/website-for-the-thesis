function nextToContainer(idCurrentContainer, idNextContainer) {
    const array = ['left', 'center', 'right']
    const CurrentContainer = document.getElementById(idCurrentContainer);
    const NextContainer = document.getElementById(idNextContainer);
    const CurrentContainerPosition = CurrentContainer.classList.item(1);
    const NextContainerPosition = NextContainer.classList.item(1);
    setTimeout(() => {
        if (array.indexOf(CurrentContainerPosition) < array.indexOf(NextContainerPosition)){
            CurrentContainer.classList.remove(CurrentContainerPosition);
            CurrentContainer.classList.add(array[array.indexOf(CurrentContainerPosition) - 1]);   
            NextContainer.classList.add(array[array.indexOf(NextContainerPosition) - 1]);
            NextContainer.classList.remove(NextContainerPosition);
        }else{
            CurrentContainer.classList.remove(CurrentContainerPosition);
            CurrentContainer.classList.add(array[array.indexOf(CurrentContainerPosition) + 1]);
            NextContainer.classList.add(array[array.indexOf(NextContainerPosition) + 1]);
            NextContainer.classList.remove(NextContainerPosition);
        }
    }, 200);
}