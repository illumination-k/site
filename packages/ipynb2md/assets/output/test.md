<details>
<summary>Notebook Metadata</summary>

```json
{
  "kernelspec": {
    "display_name": "3.11.5",
    "name": "python3",
    "language": "python"
  },
  "language_info": {
    "codemirror_mode": {
      "name": "ipython",
      "version": 3
    },
    "file_extension": ".py",
    "mimetype": "text/x-python",
    "name": "python",
    "pygments_lexer": "ipython3",
    "nbconvert_exporter": "python",
    "version": "3.11.5"
  }
}
```

</details>


## test

```python
print("test")
```

`test
`

```python
a
```

<div class='ipynb-error'>

<p><span style="color:rgb(187, 0, 0)">---------------------------------------------------------------------------</span></p>

<p><span style="color:rgb(187, 0, 0)">NameError</span>                                 Traceback (most recent call last)</p>

<p>Cell <span style="color:rgb(0, 187, 0)">In[1], line 1</span>
<span style="color:rgb(0, 187, 0)">----> 1</span> <span style="background-color:rgb(187, 187, 0)">a</span>
</p>

<p><span style="color:rgb(187, 0, 0)">NameError</span>: name 'a' is not defined</p>

</div>

```python
from matplotlib import pyplot as plt

fig = plt.figure()
ax = fig.add_subplot(111)

x = [1, 2, 3, 4, 5]
y = [1, 2, 3, 4, 5]

ax.plot(x, y)
```

`[<matplotlib.lines.Line2D at 0x10784c8d0>]`

![test.png](./test.png)


`<Figure size 640x480 with 1 Axes>`
