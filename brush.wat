(module
    (; Imports ;)
    (import "env" "memory" (memory 0))
    (import "env" "copy_pixels_from_memory" (func $fb::copyFromMemory (param i32 i32 i32 i32 i32)))
    (import "env" "copy_pixels_to_memory" (func $fb::copyToMemory (param i32 i32 i32 i32 i32)))

    (; Globals ;)
    (global $setting.maxRadius (export "setting/max_radius") (mut f32) (f32.const 10.0))

    (; Callbacks ;)
    (func $callback.penInput (export "callback/pen_input")
        (param $timestamp i32)
        (param $flags i32)
        (param $x f32)
        (param $y f32)
        (param $pressure f32)
        (param $tiltX f32)
        (param $tiltY f32)
        (param $jitter f32)
        (param $strokeJitter f32)
        (result)
        (local $size i32)
        (local $halfSize i32)
        (local $i i32)

        (local.set $size (i32.trunc_f32_s (f32.mul (local.get $pressure) (global.get $setting.maxRadius))))
        (local.set $halfSize (i32.div_s (local.get $size) (i32.const 2)))

        (local.set $i (i32.const 0))
        (loop $loop
            (i32.store (i32.add (i32.const 0) (i32.mul (local.get $i) (i32.const 4))) (i32.const 0xFF000000))
            (local.set $i (i32.add (local.get $i) (i32.const 1)))
            (i32.lt_s (local.get $i) (i32.mul (local.get $size) (local.get $size)))
            br_if $loop
        )

        (call $fb::copyFromMemory
            (i32.const 0)
            (i32.sub (i32.trunc_f32_s (local.get $x)) (local.get $halfSize))
            (i32.sub (i32.trunc_f32_s (local.get $y)) (local.get $halfSize))
            (local.get $size)
            (local.get $size)
        )
    )
)